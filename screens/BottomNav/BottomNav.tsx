import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../HomeScreen/HomeScreen';
import ShortsScreen from '../ShortsScreen/ShortsScreen';
import UploadScreen from '../UploadScreen/UploadScreen';
import SavedScreen from '../SavedScreen/SavedScreen';


export default function BottomNav() {
    const Tab = createBottomTabNavigator();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: 'gray',
                tabBarIcon: ({ focused, color, size }) => {
                    let icon;

                    switch (route.name) {
                        case 'Home':
                            icon = focused
                                ? require('../../assets/filled/home.png')     // selected icon
                                : require('../../assets/outlined/home.png');  // default icon
                            break;
                        case 'Shorts':
                            icon = focused
                                ? require('../../assets/filled/shorts.png')
                                : require('../../assets/outlined/shorts.png');
                            break;
                        case 'Upload':
                            icon = focused
                                ? require('../../assets/outlined/create.png')
                                : require('../../assets/outlined/create.png');
                            break;
                        case 'Library':
                            icon = focused
                                ? require('../../assets/filled/vidlib.png')
                                : require('../../assets/outlined/vidlib.png');
                            break;
                    }

                    return (
                        <Image
                            source={icon}
                            style={{
                                width: size,
                                height: size,
                                tintColor: color,
                                resizeMode: 'contain',
                            }}
                        />
                    );
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Shorts" component={ShortsScreen} />
            <Tab.Screen name="Upload" component={UploadScreen} />
            <Tab.Screen name="Library" component={SavedScreen} />
        </Tab.Navigator>
    )

}

const styles = StyleSheet.create({

})