import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import Icon from "react-native-vector-icons/Ionicons";
import ActionButtons from './ActionButtons';
import ChannelDetails from './ChannelDetails';
import { VideoDescription } from '../../../utils/types';

type Props = {
    videoDes: VideoDescription
    onDownloadPress: () => void,
    onChannelClick: () => void;

}
export default function VideoDetails(props: Props) {
    const formattedViews = Number(props.videoDes.views).toLocaleString();
    const viewInfo = `${formattedViews} views • ${props.videoDes.uploaded}`
    const cleanTags = props.videoDes.hashTags
        .replace(/\\/g, "")   // remove all backslashes
        .trim();

    const first2Tags = cleanTags.split(/\s+/).slice(0, 2).join(" ");
    const remainingTags = cleanTags.split(/\s+/).slice(2).join(" ");
    return (
        <View style={styles.root}>
            <View style={styles.title}>
                <Text style={{ fontFamily: "Roboto-Medium", fontSize: 18 }}
                    numberOfLines={3}
                    ellipsizeMode="tail">
                    {props.videoDes.title}
                </Text>
                <TouchableOpacity>
                    <Icon name="chevron-down" size={28} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.uploadDetails}>
                <View style={styles.firstHasTag}>
                    <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#6C6C6C" }}>
                        {viewInfo}
                    </Text>
                    <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#068BFF" }}>
                        {first2Tags}
                    </Text>
                </View>
                <Text style={{ fontFamily: "Roboto-Medium", fontSize: 14, color: "#068BFF" }} numberOfLines={1}>
                    {remainingTags}
                </Text>

            </View>
            <ActionButtons onDownloadPress={() => props.onDownloadPress()} likesCount={props.videoDes.likes} dislikesCount={props.videoDes.dislikes} />
            <ChannelDetails channelName={props.videoDes.channelName} channelPhoto={props.videoDes.channelPhoto} subscriberCount={props.videoDes.subscriber} onChannelClick={props.onChannelClick} />
            <View style={styles.commentBlock}>

                <View style={styles.cmt}>

                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14 }}>
                        Comments

                    </Text>
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14, color: "#6C6C6C" }}>
                        {props.videoDes.commentsCount}
                    </Text>

                </View>

                <TouchableOpacity>
                    <Image source={require("../../../assets/expand.png")} style={styles.expnad} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    title: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center", // keeps chevron vertically centered
        paddingRight: 30,
    }
    ,
    uploadDetails: {
        paddingRight: 5
    }
    ,
    commentBlock: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    }
    ,
    cmt: {
        flexDirection: "row",
        gap: 10
    }
    ,
    root: {
        paddingHorizontal: 10,

    }
    ,
    expnad: {
        height: 20,
        width: 15,

    }
    ,
    firstHasTag: {
        flexDirection: "row",
        gap: 5
    }
})