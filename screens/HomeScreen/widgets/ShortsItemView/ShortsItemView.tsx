import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Video } from '../../../../utils/types'
import { ytThumbs } from '../../../../utils/downloadFunctions'

type Props = {
  item: Video,
  onItemPress: () => void;
}

export default function (props: Props) {
  const [thumb, setThumb] = useState(ytThumbs(props.item.videoId).hq);

  return (
    <View style={styles.root}>
      <TouchableOpacity onPress={props.onItemPress}>
        <Image
          source={{ uri: thumb }}
          style={styles.img}
          resizeMode="cover"
          onError={() => setThumb(ytThumbs(props.item.videoId).mq)}
        />
      </TouchableOpacity>

      {/* More button */}
      <TouchableOpacity style={styles.vertMore}>
        <Icon name="more-vert" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Info overlay */}
      <View style={styles.info}>
        <Text style={styles.title}
          numberOfLines={2}        // ⚡ Limit to 2 lines
          ellipsizeMode="tail"  >{props.item.title}</Text>
        {props.item.views != null && props.item.views !== "null" && (
          <Text style={styles.views}>{props.item.views}</Text>
        )}

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  img: {
    height: 250,
    width: 160,
    borderRadius: 8
  },
  vertMore: {
    position: "absolute",
    right: 5,
    top: 5
  },
  root: {
    height: 250,
    width: 160
  },
  info: {
    position: "absolute",
    bottom: 5,
    left: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 4,
    borderRadius: 4
  },
  title: {
    fontFamily: "Roboto-Medium",
    fontSize: 14,
    color: "#fff"
  },
  views: {
    fontFamily: "Roboto-Regular",
    fontSize: 12,
    color: "#ccc",
    marginTop: 2
  }
})
