import React from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'

type MenuItem = {
    label: string
    onPress: () => void
}

type Props = {
    visible: boolean
    onToggle: () => void
    onClose: () => void
    items: MenuItem[]
}

export default function OverflowMenu({
    visible,
    onToggle,
    onClose,
    items,
}: Props) {
    return (
        <>
            {/* More Button */}
            <Pressable style={styles.moreBtn} onPress={onToggle}>
                <Text style={styles.moreText}>⋮</Text>
            </Pressable>

            {/* Overlay + Menu */}
            {visible && (
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Pressable style={styles.menu}>
                        {items.map((item, index) => (
                            <Pressable
                                key={index}
                                style={styles.menuItem}
                                onPress={item.onPress}
                            >
                                <Text style={styles.menuText}>{item.label}</Text>
                            </Pressable>
                        ))}
                    </Pressable>
                </Pressable>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    moreBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreText: {
        fontSize: 20,
        fontWeight: '600',
    },

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 15,
    },
    menu: {
        position: 'absolute',
        top: 64,
        right: 12,
        width: 160,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    menuText: {
        fontSize: 14,
    },
})
