import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { ResizeMode } from 'react-native-video'


export default function MenuBar() {

    const menus = [
        "All", "Music", "Mixes", "Graphics", "Bollywood"
    ]
    const [selectedMenu, setSelcetedMenu] = useState("All")

    return (
        <View style={styles.root}>
            <View style={styles.horizontalLine} />
            <ScrollView horizontal contentContainerStyle={styles.sclv} showsHorizontalScrollIndicator={false}>
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
    root: {
        marginLeft: 3,
        marginTop: 10
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
        alignItems: "center",
        marginBottom:10
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
    ,
    horizontalLine: {
        backgroundColor: "#CECECE",
        height: 1,
        marginBottom: 10,
       marginHorizontal:10
    }
})