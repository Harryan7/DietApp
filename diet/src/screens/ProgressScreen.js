import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';

const ProgressScreen = () => {
  const { user } = useContext(AuthContext);
  const [weightData, setWeightData] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    loadWeightHistory();
    loadTodayCalories();
  }, [user]);

  const loadWeightHistory = async () => {
    try {
      const weightDoc = await firestore()
        .collection('weightHistory')
        .doc(user.uid)
        .get();

      if (weightDoc.exists) {
        const sortedData = weightDoc.data().weights.sort((a, b) => a.date - b.date);
        setWeightData(sortedData);
      }
    } catch (error) {
      console.error('Kilo geçmişi yüklenirken hata:', error);
    }
  };

  const loadTodayCalories = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const calorieDoc = await firestore()
        .collection('calorieTracking')
        .doc(user.uid)
        .collection('daily')
        .doc(today.toISOString().split('T')[0])
        .get();

      if (calorieDoc.exists) {
        setTotalCalories(calorieDoc.data().total);
      }
    } catch (error) {
      console.error('Kalori verisi yüklenirken hata:', error);
    }
  };

  const addNewWeight = async () => {
    if (!newWeight || isNaN(newWeight)) {
      return;
    }

    const weightFloat = parseFloat(newWeight);
    const now = new Date();

    try {
      const newData = [...weightData, { weight: weightFloat, date: now.getTime() }];
      
      await firestore()
        .collection('weightHistory')
        .doc(user.uid)
        .set({ weights: newData });

      setWeightData(newData);
      setNewWeight('');
    } catch (error) {
      console.error('Kilo eklenirken hata:', error);
    }
  };

  const getChartData = () => {
    const labels = weightData.map(data => {
      const date = new Date(data.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const data = weightData.map(data => data.weight);

    return {
      labels,
      datasets: [{
        data,
      }],
    };
  };

  const calculateProgress = () => {
    if (weightData.length < 2) return 0;
    
    const initialWeight = weightData[0].weight;
    const currentWeight = weightData[weightData.length - 1].weight;
    const targetWeight = parseFloat(user.targetWeight);

    const totalProgress = Math.abs(targetWeight - initialWeight);
    const currentProgress = Math.abs(currentWeight - initialWeight);

    return (currentProgress / totalProgress) * 100;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kilo Takibi</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newWeight}
            onChangeText={setNewWeight}
            placeholder="Yeni kilo"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={addNewWeight}>
            <Text style={styles.buttonText}>Ekle</Text>
          </TouchableOpacity>
        </View>

        {weightData.length > 1 && (
          <View style={styles.chartContainer}>
            <LineChart
              data={getChartData()}
              width={Dimensions.get('window').width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>İlerleme</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${Math.min(calculateProgress(), 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {`%${Math.round(calculateProgress())}`}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Günlük Kalori</Text>
        <Text style={styles.calorieText}>{totalCalories} kcal</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 5,
    fontSize: 16,
  },
  calorieText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#007AFF',
  },
});

export default ProgressScreen; 