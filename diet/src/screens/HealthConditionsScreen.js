import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';

const healthConditions = [
  'Diyabet',
  'Çölyak',
  'Laktoz İntoleransı',
  'Hipertansiyon',
  'Kolesterol',
  'Kalp Hastalığı',
];

const HealthConditionsScreen = () => {
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleCondition = (condition) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter(item => item !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sağlık Durumu</Text>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Hastalık Ekle</Text>
      </TouchableOpacity>

      <FlatList
        data={selectedConditions}
        renderItem={({ item }) => (
          <View style={styles.conditionItem}>
            <Text>{item}</Text>
            <TouchableOpacity onPress={() => toggleCondition(item)}>
              <Text style={styles.removeText}>Kaldır</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={item => item}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Hastalık Seçin</Text>
          
          <FlatList
            data={healthConditions}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.conditionOption}
                onPress={() => {
                  toggleCondition(item);
                  setModalVisible(false);
                }}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item}
          />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  removeText: {
    color: 'red',
  },
  modalView: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    marginTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  conditionOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default HealthConditionsScreen; 