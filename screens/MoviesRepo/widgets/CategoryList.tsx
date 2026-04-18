import React from "react";
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Video } from "../../../utils/types";

interface CategoryListProps {
    cats: Video[];
    onItemPress: (video: Video) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
    cats,
    onItemPress
}) => {
    const renderCategoryItem = ({ item, index }: { item: Video; index: number }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => onItemPress(item)}
        >
            <Text style={styles.categoryText}>
                {index + 1} • {item.title}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Categories</Text>

            <FlatList
                data={cats}
                renderItem={renderCategoryItem}
                keyExtractor={(_, index) => index.toString()}
                scrollEnabled={false} // important when inside another FlatList
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 12,
        marginVertical: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 6,
    },
    categoryItem: {
        backgroundColor: "#f2f2f2",
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 14,
        color: "#333",
    },
});