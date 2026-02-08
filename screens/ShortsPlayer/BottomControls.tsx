import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

type props = {
  title: string,
  channelName: string,
  channelThumbnail: string,
  onChannePress: () => void;
}
export default function BottomControls(props: props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{props.title}</Text>
      <View style={styles.bottomBar}>


        <View style={styles.firstGroup}>
          <TouchableOpacity style={styles.channelPhotoContainer} onPress={props.onChannePress}>
            <Image source={{ uri: props.channelThumbnail }} style={styles.channelPhoto} />
          </TouchableOpacity>
          <Text numberOfLines={1}
            ellipsizeMode="tail" style={styles.channelName}>
            {props.channelName}
          </Text>
          <View style={styles.subscribeBtn}>
            <Text style={{ color: "white" }}>SUBSCRIBE</Text>
          </View>
        </View>

        <Image source={require("../../assets/shortsIcons/audioWave.png")} style={styles.audioWave} />

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 25,
    left: 10,
    width: "100%"
  }
  ,
  title: {
    color: "white",
    width: 250,
    fontFamily: "Roboto-Medium"
  }
  ,
  channelPhotoContainer: {
    height: 30,
    width: 30
  }
  ,
  channelPhoto: {
    height: 40,
    width: 40
  }
  ,
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
    paddingRight: 35
  }
  ,
  channelName: {
    color: "white",
    marginLeft: 10,
  }
  ,
  subscribeBtn: {
    backgroundColor: "red",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 5
  }
  ,
  audioWave: {
    height: 30,
    width: 30,
  }
  ,
  firstGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  }
})