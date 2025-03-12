import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const activityLevels = [
  {
    id: 'sedentary',
    title: 'Masa Başı İş',
    description: 'Günlük aktiviteniz minimum düzeyde',
    multiplier: 1.2
  },
  {
    id: 'light',
    title: 'Hareketli İş',
    description: 'Günlük olarak ayakta ve hareketlisiniz',
    multiplier: 1.375
  },
  {
    id: 'moderate',
    title: 'Haftada 3 Gün Spor',
    description: 'Düzenli egzersiz yapıyorsunuz',
    multiplier: 1.55
  },
  {
    id: 'active',
    title: 'Her Gün Spor',
    description: 'Yoğun fiziksel aktivite',
    multiplier: 1.725
  }
];

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    gender: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: '',
  });

  const handleRegister = async () => {
    try {
      const { email, password } = formData;
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Kullanıcı bilgilerini Firestore'a kaydet
      await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .set({
          ...formData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error(error);
      alert('Kayıt işlemi başarısız oldu!');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={formData.email}
        onChangeText={(text) => setFormData({...formData, email: text})}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => setFormData({...formData, password: text})}
      />
      
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            formData.gender === 'female' && styles.selectedGender
          ]}
          onPress={() => setFormData({...formData, gender: 'female'})}
        >
          <Text>Kadın</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.genderButton,
            formData.gender === 'male' && styles.selectedGender
          ]}
          onPress={() => setFormData({...formData, gender: 'male'})}
        >
          <Text>Erkek</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Mevcut Kilo"
        keyboardType="numeric"
        value={formData.currentWeight}
        onChangeText={(text) => setFormData({...formData, currentWeight: text})}
      />

      <TextInput
        style={styles.input}
        placeholder="Hedef Kilo"
        keyboardType="numeric"
        value={formData.targetWeight}
        onChangeText={(text) => setFormData({...formData, targetWeight: text})}
      />

      <Text style={styles.sectionTitle}>Aktivite Seviyeniz</Text>
      {activityLevels.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.activityButton,
            formData.activityLevel === level.id && styles.selectedActivity
          ]}
          onPress={() => setFormData({...formData, activityLevel: level.id})}
        >
          <Text style={styles.activityTitle}>{level.title}</Text>
          <Text style={styles.activityDescription}>{level.description}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Kayıt Ol</Text>
      </TouchableOpacity>
    </ScrollView>
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
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedGender: {
    backgroundColor: '#e3e3e3',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  activityButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedActivity: {
    backgroundColor: '#e3e3e3',
    borderColor: '#007AFF',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default RegisterScreen; 