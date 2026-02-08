import { Animated, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from "@react-navigation/native";

export default function SplashScreen() {
    const scaleY = useRef(new Animated.Value(1)).current
    const navigation = useNavigation<navStack>();

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleY, {
                toValue: 0.1,
                duration: 700,
                useNativeDriver: true
            }),
            Animated.timing(scaleY, {
                toValue: 0.1,
                duration: 700,
                useNativeDriver: true
            })
        ]).start(
            () => {
                navigation.navigate("SitesScreen");
            }
        )
    }, [])

    return (
        <SafeAreaView style={styles.container}>
            <Animated.Image
                source={require('..//../assets/Logo.png')}
                resizeMode="contain"
                style={[styles.logo, { transform: [{ scaleY }] }]}
            />
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    logo: {
        width: 140,
        height: 140,
    }
    ,
    container: {
        flex: 1,
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center"
    }
})