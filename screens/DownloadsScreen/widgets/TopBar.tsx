import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons';

type topBarCallbacks = {
    onLensPress: () => void,
    onBackPress: () => void
}

export default function TopBar(props: topBarCallbacks) {
    const assetsFolder = "../../../assets"
    return (
        <View style={styles.root}>
            <View style={styles.logoCast}>
                <View style={styles.left}>
                    <TouchableOpacity onPress={props.onBackPress}>
                        <Icon name='arrow-back' size={28} />
                    </TouchableOpacity>
                    <Text style={{
                        fontFamily: "Roboto-Medium",
                        fontSize: 18
                    }}>Downloads</Text>

                </View>
                <View style={styles.otherIcons}>
                    <Image style={styles.cstIcon} source={require(`${assetsFolder}/topRightIcons/cast.png`)} />
                    <Image style={styles.smIcons} source={require(`${assetsFolder}/topRightIcons/bell.png`)} />
                    <TouchableOpacity onPress={props.onLensPress}>
                        <Image style={styles.smIcons} source={require(`${assetsFolder}/topRightIcons/lens.png`)} />
                    </TouchableOpacity>
                    <Image style={styles.smIcons} source={require(`${assetsFolder}/topRightIcons/person.png`)} />

                </View>
            </View>

            <View style={styles.horizontalLine}>

            </View>



        </View>
    )
}

const styles = StyleSheet.create({
    logo: {
        width: 100,
        height: 20
    }
    ,
    root: {
        marginHorizontal: 12,
        marginTop: 12,


    }
    ,
    otherIcons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    }
    ,
    smIcons: {
        height: 28,
        width: 28
    }
    ,
    cstIcon: {
        height: 22,
        width: 22
    }
    ,
    logoCast: {
        flexDirection: "row",
        justifyContent: "space-between"
    }
    ,
    horizontalLine: {
        backgroundColor: "#CECECE",
        height: 1,
        marginTop: 12
    }
    ,
    left: {
        flexDirection: "row",
        gap: 10
    }
})


