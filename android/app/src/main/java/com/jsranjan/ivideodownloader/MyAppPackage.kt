package com.jsranjan.ivideodownloader

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.jsranjan.ivideodownloader.MyNativeModule

class MyAppPackage : ReactPackage {
    // Register native modules (like your MyNativeModule)
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(MyNativeModule(reactContext))

    // Return an empty list because you have no native UI components
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
