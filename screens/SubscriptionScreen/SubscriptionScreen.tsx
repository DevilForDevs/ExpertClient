import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import TopBar from '../HomeScreen/widgets/TopBar/TopBar'
import { SafeAreaView } from 'react-native-safe-area-context'
import TopSubscribers from './widgets/TopSubscribers'
import Menu from '../HomeScreen/widgets/TopBar/widgets/Menu'
import MenuBar from './widgets/MenuBar'
import VideoItemView from './widgets/VideoItemView'
import { Video } from '../../utils/types'

export default function SubscriptionScreen() {

  const video: Video = {
    type: "video",
    videoId: "39KvwIHB5cM",
    title: "VideoTiel",
    publishedOn: "2000",
    views: "200k"
  }

  return (
    <SafeAreaView style={styles.root}>
      <TopBar onLensPress={() => console.log("lens clcked")} />
      <TopSubscribers />
      <MenuBar />
      <VideoItemView item={video} onItemPress={() => console.log("itemclicked")} progress={0} isShort={true}/>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({


  root: {
    marginTop: 5,
    paddingVertical: 10
  }
})