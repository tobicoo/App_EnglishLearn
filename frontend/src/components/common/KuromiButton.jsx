import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';

export default function KuromiButton({ 
  title, 
  onPress, 
  color = '#111', 
  shadowColor = '#000', 
  textColor = '#fff',
  style 
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.container, style]}>
      <View style={[styles.shadow, { backgroundColor: shadowColor }]} />
      <View style={[styles.button, { backgroundColor: color }]}>
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { height: 55, width: '100%', marginVertical: 8 },
  shadow: { position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, borderRadius: 16 },
  button: { flex: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  text: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
});
