import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'

type Props = {
  icon: string,
  title: string,
  subtitle: string,
  showCheck: boolean,
  onItemClick: () => void;
}

const icons: Record<string, any> = {
  history: require('../../../assets/libscreen/historyBlack.png'),
  yourVideo: require('../../../assets/libscreen/yourVideos.png'),
  downloads: require('../../../assets/libscreen/downloadbtn.png'),
  yourMovies: require('../../../assets/libscreen/FilmStrip.png'),
  watchLater: require('../../../assets/libscreen/clock.png'),
}

export default function MenuItem(props: Props) {
  const iconSource = icons[props.icon] || require('../../../assets/libscreen/downloadbtn.png') // fallback

  return (
    <View style={styles.root}>
      <TouchableOpacity onPress={props.onItemClick}>
        <View style={styles.left}>
          <Image source={iconSource} style={styles.img} />
          <View>
            <Text style={styles.title}>{props.title}</Text>
            <Text style={styles.subtitle}>{props.subtitle}</Text>
          </View>
        </View>
      </TouchableOpacity>
      {props.showCheck ? (
        <Image
          source={require('../../../assets/libscreen/CheckCircle.png')}
          style={styles.checkImg}
        />
      ) : (
        <View />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  left: {
    flexDirection: 'row',


  },
  img: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  checkImg: {
    width: 24,
    height: 24,
  },
})
