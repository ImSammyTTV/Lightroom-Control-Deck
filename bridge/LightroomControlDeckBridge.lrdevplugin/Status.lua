local LrDialogs = import 'LrDialogs'

local connected = _G.sdBridgeConnected == true
LrDialogs.message(
	'Lightroom Control Deck',
	connected and 'Lightroom Control Deck is running and your Stream Deck is connected.'
		or 'Lightroom Control Deck is running, but no Stream Deck is connected yet. Open the Stream Deck app and check the Lightroom Control Deck plugin is installed.',
	'info'
)
