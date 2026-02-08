import React, { useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    StatusBar
} from 'react-native'
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation<navStack>();


    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Heading */}
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subHeading}>
                Sign in with your email and password
            </Text>

            {/* Email */}
            <View style={styles.inputBox}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                />
            </View>

            {/* Password */}
            <View style={styles.inputBox}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#888"
                    secureTextEntry
                    style={styles.input}
                />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("BrowserScreen")}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>


        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        justifyContent: 'center'
    },

    heading: {
        fontSize: 34,
        fontWeight: '900',
        color: '#000',
        marginBottom: 6
    },

    subHeading: {
        fontSize: 16,
        color: '#555',
        marginBottom: 32
    },

    inputBox: {
        marginBottom: 20
    },

    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8
    },

    input: {
        height: 56,
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
        fontWeight: '500'
    },

    forgotWrapper: {
        alignItems: 'flex-end',
        marginBottom: 28
    },

    forgotText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000'
    },

    button: {
        height: 58,
        backgroundColor: '#000',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },

    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800'
    },

    footerText: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 14,
        color: '#666'
    },

    link: {
        fontWeight: '700',
        color: '#000'
    }
})
