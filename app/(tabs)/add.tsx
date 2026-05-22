import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Add workout coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#888',
  },
});
