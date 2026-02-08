import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'


type Props = {
    likesCount: string,
    dislikesCount: string
    onDownloadPress: () => void
}
export default function ActionButtons(props: Props) {
    return (
        <View style={styles.actionbtns}>
            <TouchableOpacity>
                <View>
                    <Image source={require("../../../assets/actionIcons/like.png")} style={styles.actionIcon} />
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14 }}>{props.likesCount}</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity>
                <View>
                    <Image source={require("../../../assets/actionIcons/dislike.png")} style={styles.actionIcon} />
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14 }}>{props.dislikesCount}</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity>
                <View>
                    <Image source={require("../../../assets/actionIcons/share.png")} style={styles.actionIcon} />
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14 }} >Share</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => props.onDownloadPress()}>
                <View>
                    <Image source={require("../../../assets/actionIcons/downloadbtn.png")} style={styles.actionIcon} />
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14 }}>Download</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity>
                <View>
                    <Image source={require("../../../assets/actionIcons/save.png")} style={styles.actionIcon} />
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14 }}>Save</Text>
                </View>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    actionbtns: {
        flexDirection: "row",
        gap: 35,
        paddingHorizontal: 5,
        marginBottom: 10,
        marginTop: 5,

    }
    ,
    actionIcon: {
        height: 35,
        width: 35,
    }
})