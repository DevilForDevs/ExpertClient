import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function ShortsHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.container2}>
        <Image style={styles.shortlogo} source={require("../../../../assets/Frame 14.png")} />
        <Text style={styles.title}>Shorts</Text>
      </View>
      <Text style={styles.beta}>BETA</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  shortlogo: {
    height: 55,
    width: 50
  }
  ,
  title: {
    fontFamily: "Roboto-Medium",
    fontSize: 21,
    color: "#000000",
    alignItems: "baseline"
  }
  ,
  container: {
    flexDirection: "row",
    marginBottom:10
  }
  ,
  container2: {
    flexDirection:"row",
    alignItems: "center",
    gap:7
  }
,
    beta: {
        fontFamily:"Roboto-Regular",
        color:"#9D9D9D",
        marginTop:10,
        marginLeft:5
    }
  })