import { Image, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ytThumbs } from '../../../../utils/downloadFunctions';
import { Video } from '../../../../utils/types';

type Props = {
  item: Video;
  onItemPress: () => void;
  progress: number;
  onDownload: () => void;
  onChannelClick: () => void;

};

export default function VideoItemView(props: Props) {

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
      {props.item.duration != null && (<Text style={styles.floatingDuration}>
        {props.item.duration}
      </Text>)}
      <View style={styles.info}>
        <TouchableOpacity onPress={props.onChannelClick}>
          <Image source={{ uri: props.item.channel }} style={styles.profile} />
        </TouchableOpacity>

        <View style={styles.rightSection}>
          <View style={styles.titleRow}>
            <Text
              style={{ fontFamily: 'Roboto-Medium', fontSize: 16 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {props.item.title}
            </Text>

            <TouchableOpacity style={styles.vertMore} onPress={() => props.onDownload()}>
              <Icon name="more-vert" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <Text
            style={{ fontFamily: 'Roboto-Medium', fontSize: 15, color: '#6C6C6C' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {props.item.views} • {props.item.publishedOn}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 20,
    position: 'relative',
  },
  img: {
    height: 200,
    width: '100%',
    resizeMode: 'cover',
  },
  profile: {
    height: 42,
    width: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  info: {
    marginTop: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rightSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 15,
  },
  vertMore: {
    marginRight: 10,
  },
  floatingDuration: {
    position: 'absolute',
    backgroundColor: 'white',
    paddingHorizontal: 5,
    borderRadius: 3,
    bottom: 85,
    right: 10,
  }
});
