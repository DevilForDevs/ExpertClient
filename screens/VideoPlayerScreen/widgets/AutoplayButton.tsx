import React, { useState, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View, StyleSheet, Easing, Image } from 'react-native';


type Props = {
    enabled?: boolean;
    onToggle?: (enabled: boolean) => void;
};

export default function AutoplayButton({ enabled = true, onToggle }: Props) {
    const [isOn, setIsOn] = useState(enabled);

    // animated value for circle position
    const translateX = useRef(new Animated.Value(isOn ? 20 : 0)).current;

    const toggle = () => {
        const newState = !isOn;
        setIsOn(newState);
        onToggle?.(newState);

        Animated.timing(translateX, {
            toValue: newState ? 20 : 0,
            duration: 250,
            easing: Easing.out(Easing.circle),
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity style={styles.container} onPress={toggle} activeOpacity={0.8}>
            {/* grey background */}
            <View style={styles.track}>
                {/* animated circle with play icon */}
                <Animated.View style={[{ transform: [{ translateX }] }]}>
                    {isOn ? (
                        <Image source={require("../../../assets/tinyPlaybtn.png")} style={styles.tinypausebtns} />
                    ) : (
                        <Image source={require("../../../assets/tinypausebtn.png")} style={styles.tinypausebtns} />
                    )}
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 5,
    },
    track: {
        width: 40,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.32)', // 32% opacity white
        justifyContent: 'center',
    },
    tinypausebtns: {
        height: 20,
        width: 20

    }
});
