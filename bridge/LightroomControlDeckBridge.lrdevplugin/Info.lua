return {
	LrSdkVersion = 6.0,
	LrSdkMinimumVersion = 6.0,
	LrToolkitIdentifier = 'com.imsammy.lightroom-control-deck.bridge',
	LrPluginName = 'Lightroom Control Deck Bridge',
	LrInitPlugin = 'Init.lua',
	LrShutdownPlugin = 'Shutdown.lua',
	LrForceInitPlugin = true,
	-- Keep this menu item. Lightroom only starts the bridge at launch when the plugin contributes a menu entry;
	-- without one, Init.lua never runs and the Stream Deck cannot connect.
	LrExportMenuItems = { { title = 'Lightroom Control Deck: Status', file = 'Status.lua' } },
	VERSION = { major = 0, minor = 1, revision = 0 },
}
