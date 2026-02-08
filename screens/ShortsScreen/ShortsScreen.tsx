import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { DownloadsStore, useVideoStore } from "../../utils/Store";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useNavigation } from "@react-navigation/native";
import { useRef } from 'react';


export default function ShortsScreen() {
  const navigation = useNavigation<navStack>();
  const {
    totalVideos,
  } = useVideoStore();
  const [shortGroupIndex, setShortGroupIndex] = useState(0);

  const goToShorts = () => {
    const totalLen = totalVideos.length;
    if (totalLen === 0) return;

    for (let i = 0; i < totalLen; i++) {
      const index = (shortGroupIndex + i) % totalLen;
      const item = totalVideos[index];

      if (item.type === "shorts" && item.videos.length > 0) {
        navigation.navigate("ShortsPlayerScreen", {
          arrivedVideo: item.videos[0],
        });

        // mark this group as used
        setShortGroupIndex((index + 1) % totalLen);
        return; // ✅ stop after first valid match
      }
    }
  };


  return (
    <View style={styles.container}>
      <Text>ShortsScreen</Text>

      <TouchableOpacity style={styles.button} onPress={goToShorts}>
        <Text style={styles.buttonText}>Go to Shorts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#ff0000",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});