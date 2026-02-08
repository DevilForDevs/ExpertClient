import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

type Props = {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    onSubmit?: (query: string) => void; // <-- callback when search is submitted
};

export default function SearchBar({
    value,
    onChangeText,
    placeholder = 'Search',
    onSubmit,
}: Props) {
    const [text, setText] = useState(value || '');

    return (
        <TextInput
            value={text}
            onChangeText={(t) => {
                setText(t);
                onChangeText?.(t);
            }}
            placeholder={placeholder}
            placeholderTextColor="#888"
            style={styles.search}
            returnKeyType="search" // makes Enter key show as “Search”
            onSubmitEditing={() => {
                onSubmit?.(text); // trigger search callback
            }}
        />
    );
}

const styles = StyleSheet.create({
    search: {
        width: 140,
        height: 36,
        backgroundColor: '#f1f1f1',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 14,
        marginRight: 6,
    },
});
