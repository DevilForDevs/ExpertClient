import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

export default function TopSubscribers() {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.item}>
                <Image source={require("../../../assets/person2.png")} style={styles.subsPhoto} />
                <Text style={styles.title}>Like Nastya</Text>
                <View style={styles.blueDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.item}>
                <Image source={require("../../../assets/person2.png")} style={styles.subsPhoto} />
                <Text style={styles.title}>Like Nastya</Text>
                <View style={styles.blueDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.item}>
                <Image source={require("../../../assets/person2.png")} style={styles.subsPhoto} />
                <Text style={styles.title}>Like Nastya</Text>
                <View style={styles.blueDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.item}>
                <Image source={require("../../../assets/person2.png")} style={styles.subsPhoto} />
                <Text style={styles.title}>Like Nastya</Text>
                <View style={styles.blueDot} />
            </TouchableOpacity>
            <TouchableOpacity>
                <Text style={styles.all}>All</Text>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    subsPhoto: {
        height: 55,
        width: 55
    }
    ,
    container: {
        marginTop: 10,
        paddingLeft: 15,
        flexDirection: "row",
        gap: 20,
        alignItems: "center"
    }
    ,
    title: {
        color: "#6C6C6C",
        fontFamily: "Roboto-Regular",
        width: 45
    }
    ,
    item: {
        alignItems: "center"
    }
    ,
    blueDot: {
        position: "absolute",
        height: 15,
        width: 15,
        backgroundColor: "#075FDE",
        borderRadius: 7,
        bottom: "41%",
        right: "7%"
    }
    ,
    all: {
        color: "#075FDE",
        fontFamily: "Roboto-Medium",
        fontSize: 18,
        marginLeft: 10,
        marginBottom: 20
    }
})