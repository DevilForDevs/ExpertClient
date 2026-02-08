import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'



export default function Menu() {

    const menus = [
        "All", "Music", "Mixes", "Graphics", "Bollywood"
    ]
    const [selectedMenu, setSelcetedMenu] = useState("All")

    return (
        <View style={styles.root}>
            <ScrollView horizontal contentContainerStyle={styles.sclv} showsHorizontalScrollIndicator={false}>

                <View style={styles.explore}>
                    <Image style={styles.discoverIcon} source={require("../../../../../assets/discover.png")}></Image>
                    <Text style={{ fontFamily: 'Roboto-Medium', fontSize: 14, color: "#000000" }}>Explore</Text>
                </View>
                <View style={styles.verticalLine}></View>
                <View style={styles.menus}>
                    {
                        menus.map((menuItem) =>

                            <TouchableOpacity key={menuItem} style={selectedMenu == menuItem ? styles.selectedMenu : styles.menuItem}
                                onPress={() => setSelcetedMenu(menuItem)}>

                                <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 14, color: menuItem == selectedMenu ? "#FFFFFF" : "#000000" }}>{menuItem}</Text>

                            </TouchableOpacity>
                        )
                    }

                </View>

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    explore: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "#ECECEC",
        borderRadius: 5
    }
    ,
    discoverIcon: {
        height: 26,
        width: 26
    }
    ,
    discoverFont: {
        fontFamily: "Roboto"
    }
    ,
    root: {
        marginLeft: 10
    }
    ,
    verticalLine: {
        height: 28,
        backgroundColor: "#CECECE",
        width: 1,
        marginLeft: 10
    }
    ,
    sclv: {
        alignItems: "center"
    }
    ,
    menus: {
        flexDirection: "row",
        gap: 5,
        marginLeft: 10
    }
    ,
    menuItem: {
        backgroundColor: "#ECECEC",
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 16,
        borderColor: "#CECECE",
        borderWidth: 1

    },
    selectedMenu: {
        backgroundColor: "#3B3B3B",
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 16,
        borderColor: "#CECECE",
        borderWidth: 1
    }
})