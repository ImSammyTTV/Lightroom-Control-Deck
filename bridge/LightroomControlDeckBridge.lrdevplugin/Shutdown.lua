return {
	LrShutdownFunction = function(doneFunction, progressFunction)
		_G.sdBridgeShutdown = true
		doneFunction()
	end,
}
