_G.sdBridgeStarted = 'yes'
-- Lightroom Control Deck Bridge: lets the Lightroom Control Deck Stream Deck plugin drive Lightroom Classic over local sockets.
--   COMMAND_PORT: Lightroom listens (Stream Deck connects) and receives "cmd:", "adj:", "reset:", "watch:" lines.
--   STATUS_PORT:  Lightroom connects to Stream Deck and sends "val:" / "state:" lines.



local LrApplication = import 'LrApplication'
local LrApplicationView = import 'LrApplicationView'
local LrDevelopController = import 'LrDevelopController'
local LrFunctionContext = import 'LrFunctionContext'
local LrLogger = import 'LrLogger'
local LrSelection = import 'LrSelection'
local LrSocket = import 'LrSocket'
local LrTasks = import 'LrTasks'
local LrUndo = import 'LrUndo'

local COMMAND_PORT = 53110
local STATUS_PORT = 53112

local log = LrLogger('LightroomControlDeckBridge')
log:enable('logfile') -- Documents/LrClassicLogs/LightroomControlDeckBridge.log

_G.sdBridgeShutdown = false

local sender
local senderConnected = false
local watched = {}
local lastSent = {}
local copiedSettings

local senderDead, receiverDead = false, false

local function send(line)
	if sender and senderConnected then
		local ok = LrTasks.pcall(function() sender:send(line .. '\n') end)
		if not ok then senderConnected = false; senderDead = true end
	end
end

local function try(fn, ...)
	local ok, err = LrTasks.pcall(fn, ...)
	if not ok then log:warn(tostring(err)) end
	return ok
end

local function ensureDevelop()
	if LrApplicationView.getCurrentModuleName() ~= 'develop' then
		LrApplicationView.switchToModule('develop')
	end
end

-- Develop parameters whose natural step differs from range/200.
local stepOverride = { Temperature = 50, Tint = 1, Exposure2012 = 0.01, local_Exposure = 0.01 }

local function reportValue(param)
	local ok, value = LrTasks.pcall(LrDevelopController.getValue, param)
	if not ok or type(value) ~= 'number' then return end
	local _, min, max = LrTasks.pcall(LrDevelopController.getRange, param)
	local line = string.format('val:%s:%s:%s:%s', param, value, tostring(min or 0), tostring(max or 0))
	if lastSent[param] ~= line then
		lastSent[param] = line
		send(line)
	end
end

local function adjust(param, ticks)
	ensureDevelop()
	local min, max = LrDevelopController.getRange(param)
	local current = LrDevelopController.getValue(param)
	-- Unknown or unavailable parameters report no range or value; skip them instead of raising an error.
	if type(min) ~= 'number' or type(max) ~= 'number' or type(current) ~= 'number' then return end
	local step = stepOverride[param] or ((max - min) / 200)
	local value = current + ticks * step
	if stepOverride[param] and stepOverride[param] < 1 then
		-- Keep fine-grained sliders on their grid so repeated ticks don't drift (0.1 + 0.2 style float error).
		value = math.floor(value / step + 0.5) * step
	end
	if value < min then value = min elseif value > max then value = max end
	LrDevelopController.setValue(param, value)
	reportValue(param)
end

local function resetParam(param)
	ensureDevelop()
	LrDevelopController.resetToDefault(param)
	reportValue(param)
end

local modules = { library = 'library', develop = 'develop', map = 'map', book = 'book', slideshow = 'slideshow', print = 'print', web = 'web' }

local function targetPhoto()
	return LrApplication.activeCatalog():getTargetPhoto()
end

local function findPreset(name)
	for _, folder in ipairs(LrApplication.developPresetFolders()) do
		for _, preset in ipairs(folder:getDevelopPresets()) do
			if preset:getName() == name then return preset end
		end
	end
end

local function findCollection(name, parents)
	for _, c in ipairs(parents:getChildCollections()) do
		if c:getName() == name then return c end
	end
	if parents.getChildCollectionSets then
		for _, set in ipairs(parents:getChildCollectionSets()) do
			local found = findCollection(name, set)
			if found then return found end
		end
	end
end

-- item:<preset|collection|keyword>:<name>
local function applyItem(kind, name)
	local catalog = LrApplication.activeCatalog()
	local photos = catalog:getTargetPhotos()
	LrTasks.startAsyncTask(function()
		catalog:withWriteAccessDo('Lightroom Control Deck ' .. kind, function()
			if kind == 'preset' then
				local preset = findPreset(name)
				if not preset then log:warn('preset not found: ' .. name); return end
				for _, p in ipairs(photos) do p:applyDevelopPreset(preset, _PLUGIN) end
			elseif kind == 'collection' then
				local c = findCollection(name, catalog)
				if not c then log:warn('collection not found: ' .. name); return end
				c:addPhotos(photos)
			elseif kind == 'keyword' then
				local kw = catalog:createKeyword(name, {}, true, nil, true)
				for _, p in ipairs(photos) do p:addKeyword(kw) end
			end
		end)
	end)
end

local commands = {
	autoWB = function() ensureDevelop(); LrDevelopController.setValue('WhiteBalance', 'Auto') end,
	resetCrop = function() ensureDevelop(); LrDevelopController.resetCrop() end,
	resetTransform = function() ensureDevelop(); LrDevelopController.resetTransforms() end,
	resetBrush = function() ensureDevelop(); LrDevelopController.resetBrushing() end,
	ratingUp = function() LrSelection.increaseRating() end,
	ratingDown = function() LrSelection.decreaseRating() end,
	pick = function() LrSelection.flagAsPick() end,
	reject = function() LrSelection.flagAsReject() end,
	unflag = function() LrSelection.removeFlag() end,
	red = function() LrSelection.toggleRedLabel() end,
	yellow = function() LrSelection.toggleYellowLabel() end,
	green = function() LrSelection.toggleGreenLabel() end,
	blue = function() LrSelection.toggleBlueLabel() end,
	purple = function() LrSelection.togglePurpleLabel() end,
	-- There is no "remove label" call, so toggle off whichever colour the photo currently has.
	-- Reading metadata can wait on Lightroom, which is only allowed inside a task.
	noLabel = function()
		LrTasks.startAsyncTask(function()
			local photo = targetPhoto()
			if not photo then return end
			local toggles = {
				red = LrSelection.toggleRedLabel, yellow = LrSelection.toggleYellowLabel, green = LrSelection.toggleGreenLabel,
				blue = LrSelection.toggleBlueLabel, purple = LrSelection.togglePurpleLabel,
			}
			local toggle = toggles[photo:getRawMetadata('colorNameForLabel')]
			if toggle then toggle() end
		end)
	end,
	prev = function() LrSelection.previousPhoto() end,
	next = function() LrSelection.nextPhoto() end,
	selectAll = function() LrSelection.selectAll() end,
	selectNone = function() LrSelection.selectNone() end,
	zoomToggle = function() LrApplicationView.toggleZoom() end,
	zoomIn = function() LrApplicationView.zoomIn() end,
	zoomOut = function() LrApplicationView.zoomOut() end,
	autoTone = function() ensureDevelop(); LrDevelopController.setAutoTone() end,
	resetAll = function() ensureDevelop(); LrDevelopController.resetAllDevelopAdjustments() end,
	undo = function() LrUndo.undo() end,
	redo = function() LrUndo.redo() end,
	copySettings = function()
		local p = targetPhoto()
		if p then copiedSettings = p:getDevelopSettings() end
	end,
	pasteSettings = function()
		if not copiedSettings then return end
		local catalog = LrApplication.activeCatalog()
		LrTasks.startAsyncTask(function()
			catalog:withWriteAccessDo('Paste settings', function()
				for _, p in ipairs(catalog:getTargetPhotos()) do p:applyDevelopSettings(copiedSettings) end
			end)
		end)
	end,
}

local function runCommand(id)
	local rating = id:match('^rate(%d)$')
	if rating then LrSelection.setRating(tonumber(rating)); return end
	local lbl = id:match('^setlabel_(%a+)$')
	if lbl then LrSelection.setColorLabel(lbl); return end
	local mod = id:match('^module_(.+)$')
	if mod then LrApplicationView.switchToModule(modules[mod]); return end
	local view = id:match('^view_(.+)$')
	if view then LrApplicationView.showView(view); return end
	local tool = id:match('^tool_(.+)$')
	if tool then ensureDevelop(); LrDevelopController.selectTool(tool); return end
	-- Crop aspect ratios: crop_<w>x<h> (e.g. crop_16x9). Experimental, see README.
	local w, h = id:match('^crop_(%d+)x(%d+)$')
	if w then
		-- Lightroom has no "set aspect ratio" call, so work out the largest centred crop of that shape and set its edges.
		ensureDevelop()
		LrDevelopController.selectTool('crop')
		LrTasks.startAsyncTask(function()
			local photo = targetPhoto()
			if not photo then log:warn('crop: no target photo'); return end
			local dims = photo:getRawMetadata('dimensions')
			if not dims or not dims.width or not dims.height or dims.width == 0 or dims.height == 0 then log:warn('crop: no dimensions'); return end
			local ratio = tonumber(w) / tonumber(h)
			-- Follow the photo's orientation, as Lightroom's own crop does.
			if (dims.width >= dims.height) ~= (ratio >= 1) then ratio = 1 / ratio end
			local photoRatio = dims.width / dims.height
			local fw, fh = 1, 1 -- kept fraction of the width and height
			if photoRatio > ratio then fw = ratio / photoRatio else fh = photoRatio / ratio end
			local left, top = (1 - fw) / 2, (1 - fh) / 2
			for _, edge in ipairs({ { 'CropAngle', 0 }, { 'CropLeft', left }, { 'CropRight', 1 - left }, { 'CropTop', top }, { 'CropBottom', 1 - top } }) do
				local ok, err = LrTasks.pcall(LrDevelopController.setValue, edge[1], edge[2])
				if not ok then log:warn('crop ' .. edge[1] .. ': ' .. tostring(err)) end
			end
		end)
		return
	end
	-- Upright: upright_<0-5> (off, auto, level, vertical, full, guided). Experimental.
	local up = id:match('^upright_(%d)$')
	if up then ensureDevelop(); LrDevelopController.setValue('PerspectiveUpright', tonumber(up)); return end
	-- AI masks: mask_<subject|sky|background|objects|people|landscape>. Experimental.
	local mask = id:match('^mask_(.+)$')
	if mask then ensureDevelop(); LrDevelopController.createNewMask('aiSelection', mask); return end
	local plain = { brush = 'brush', gradient = 'gradient', radial = 'radialGradient' }
	local m2 = id:match('^newmask_(.+)$')
	if m2 then ensureDevelop(); LrDevelopController.createNewMask(plain[m2]); return end
	local fn = commands[id]
	if fn then fn() else log:warn('unknown command ' .. id) end
end

local function handle(message)
	for line in tostring(message):gmatch('[^\r\n]+') do
		local kind, a, b = line:match('^(%w+):([^:]*):?(.*)$')
		if kind == 'cmd' then try(runCommand, a)
		elseif kind == 'item' then try(applyItem, a, b)
		elseif kind == 'adj' then try(adjust, a, tonumber(b) or 0)
		elseif kind == 'reset' then try(resetParam, a)
		elseif kind == 'watch' then watched[a] = true; lastSent[a] = nil
		end
	end
end

local function reportState()
	local ok, photo = LrTasks.pcall(targetPhoto)
	if not ok or not photo then return end
	local rating = photo:getRawMetadata('rating') or 0
	local flag = photo:getRawMetadata('pickStatus') or 0
	local label = photo:getRawMetadata('colorNameForLabel') or 'none'
	local module = LrApplicationView.getCurrentModuleName() or ''
	local line = string.format('state:%s:%s:%s:%s', rating, flag, label, module)
	if lastSent.state ~= line then
		lastSent.state = line
		send(line)
	end
end

-- Watchdog: if the bridge ever exits abnormally, start it again rather than leaving Lightroom deaf.
LrTasks.startAsyncTask(function()
	while not _G.sdBridgeShutdown do
	local ok, err = LrTasks.pcall(LrFunctionContext.callWithContext, 'streamDeckBridge', function(context)
		local receiver
		local clientLeft = false -- the command socket's client disconnected
		local settle = false     -- give the old port a moment to free before rebinding
		local closingByUs = false -- ignore the close callbacks caused by our own close() calls

		-- LrSocket.reconnect() does not reliably re-listen after the Stream Deck plugin disconnects,
		-- so closed or errored sockets are thrown away and bound again from the main loop.
		-- An idle 'timeout' just means nobody connected for ~10s; those are rebound immediately.
		local function bindSender()
			senderConnected = false
			return LrSocket.bind {
				functionContext = context, plugin = _PLUGIN, address = 'localhost', port = STATUS_PORT, mode = 'send',
				onConnected = function() senderConnected = true; _G.sdBridgeConnected = true; lastSent = {} end,
				onClosed = function() if closingByUs then return end; senderConnected = false; _G.sdBridgeConnected = false; senderDead = true; settle = true end,
				onError = function(_, e) if closingByUs then return end; senderConnected = false; _G.sdBridgeConnected = false; senderDead = true; if e ~= 'timeout' then settle = true end end,
			}
		end
		local function bindReceiver()
			return LrSocket.bind {
				functionContext = context, plugin = _PLUGIN, address = 'localhost', port = COMMAND_PORT, mode = 'receive',
				onMessage = function(_, message) handle(message) end,
				onClosed = function() if closingByUs then return end; clientLeft = true end,
				onError = function(_, e) if closingByUs then return end; receiverDead = true; if e ~= 'timeout' then settle = true end end,
			}
		end

		sender = bindSender()
		receiver = bindReceiver()

		local function iterate()
			-- The status socket never reports its client leaving, but the command socket does, and the Stream Deck
			-- plugin always drops both together, so a closed command socket means the status socket is stale too.
			if clientLeft then clientLeft = false; senderDead = true; receiverDead = true; settle = true end
			if senderDead or receiverDead then
				if settle then settle = false; LrTasks.sleep(1) end
				-- A failed bind leaves the flag set so the next pass tries again instead of ending the loop.
				if senderDead then
					closingByUs = true
					LrTasks.pcall(function() sender:close() end)
					closingByUs = false
					local okBind, fresh = LrTasks.pcall(bindSender)
					if okBind then sender = fresh; senderDead = false end
				end
				if receiverDead then
					closingByUs = true
					LrTasks.pcall(function() receiver:close() end)
					closingByUs = false
					local okBind, fresh = LrTasks.pcall(bindReceiver)
					if okBind then receiver = fresh; receiverDead = false end
				end
			end
			if senderConnected then
				try(reportState)
				for param in pairs(watched) do try(reportValue, param) end
			end
		end

		while not _G.sdBridgeShutdown do
			local okIter, iterErr = LrTasks.pcall(iterate)
			if not okIter then log:error('bridge loop: ' .. tostring(iterErr)) end
			LrTasks.sleep(0.25)
		end
		sender:close()
		receiver:close()
	end)
	if not ok then log:error(tostring(err)) end
	if not _G.sdBridgeShutdown then LrTasks.sleep(2) end
	end
end)
