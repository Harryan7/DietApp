import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import { nutritionDatabase } from '../data/nutritionDatabase';

const DietProgramScreen = () => {
  const { user } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [newFood, setNewFood] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodAmount, setFoodAmount] = useState('1');
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  useEffect(() => {
    loadDietProgram();
  }, [user]);

  const loadDietProgram = async () => {
    try {
      const dietDoc = await firestore()
        .collection('dietPrograms')
        .doc(user.uid)
        .get();

      if (dietDoc.exists) {
        setMeals(dietDoc.data().meals);
      } else {
        // Yeni diyet programı oluştur
        const defaultMeals = generateDefaultDietProgram(user);
        await firestore()
          .collection('dietPrograms')
          .doc(user.uid)
          .set({ meals: defaultMeals });
        setMeals(defaultMeals);
      }
    } catch (error) {
      console.error('Diyet programı yüklenirken hata:', error);
    }
  };

  const generateDefaultDietProgram = (user) => {
    const { gender, currentWeight, targetWeight, healthConditions = [], activityLevel } = user;
    const dailyCalorieNeeds = calculateDailyCalories(gender, currentWeight, targetWeight, activityLevel);
    
    // Temel besin grupları
    let foods = {
      breakfast: ['Yulaf', 'Süt', 'Muz', 'Yumurta'],
      lunch: ['Tavuk Göğsü', 'Bulgur Pilavı', 'Salata'],
      dinner: ['Balık', 'Sebze', 'Çorba'],
      snacks: ['Elma', 'Badem', 'Yoğurt']
    };

    // Sağlık durumlarına göre besinleri filtrele
    if (healthConditions.includes('Diyabet')) {
      foods = filterDiabeticFoods(foods);
    }
    if (healthConditions.includes('Çölyak')) {
      foods = filterGlutenFreeFoods(foods);
    }
    // Diğer sağlık durumları için filtreler...

    return [
      {
        name: 'Kahvaltı',
        foods: foods.breakfast,
        calories: dailyCalorieNeeds * 0.3
      },
      {
        name: 'Öğle Yemeği',
        foods: foods.lunch,
        calories: dailyCalorieNeeds * 0.35
      },
      {
        name: 'Akşam Yemeği',
        foods: foods.dinner,
        calories: dailyCalorieNeeds * 0.25
      },
      {
        name: 'Ara Öğünler',
        foods: foods.snacks,
        calories: dailyCalorieNeeds * 0.1
      }
    ];
  };

  const calculateDailyCalories = (gender, currentWeight, targetWeight, activityLevel) => {
    // Harris-Benedict denklemi
    let BMR;
    if (gender === 'female') {
      BMR = 655.1 + (9.563 * currentWeight) + (1.850 * 170) - (4.676 * 30);
    } else {
      BMR = 66.47 + (13.75 * currentWeight) + (5.003 * 170) - (6.755 * 30);
    }

    // Aktivite seviyesine göre çarpan
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    };

    let dailyCalories = BMR * activityMultipliers[activityLevel];

    // Hedef kiloya göre ayarlama
    const weightDiff = currentWeight - targetWeight;
    if (weightDiff > 0) {
      // Kilo vermek için
      dailyCalories -= 500;
    } else if (weightDiff < 0) {
      // Kilo almak için
      dailyCalories += 500;
    }

    return dailyCalories;
  };

  const filterDiabeticFoods = (foods) => {
    // Diyabetik beslenmeye uygun filtreleme
    const diabeticFriendly = {
      ...foods,
      breakfast: foods.breakfast.filter(food => !['Bal', 'Reçel'].includes(food)),
      snacks: foods.snacks.filter(food => !['Üzüm', 'Muz'].includes(food))
    };
    return diabeticFriendly;
  };

  const filterGlutenFreeFoods = (foods) => {
    // Glütensiz beslenmeye uygun filtreleme
    const glutenFree = {
      ...foods,
      breakfast: foods.breakfast.filter(food => !['Ekmek', 'Yulaf'].includes(food)),
      lunch: foods.lunch.filter(food => !['Bulgur', 'Makarna'].includes(food))
    };
    return glutenFree;
  };

  const handleFoodChange = async (mealIndex, foodIndex, newFood) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex].foods[foodIndex] = newFood;

    try {
      await firestore()
        .collection('dietPrograms')
        .doc(user.uid)
        .update({ meals: updatedMeals });
      
      setMeals(updatedMeals);
    } catch (error) {
      console.error('Yemek güncellenirken hata:', error);
    }
  };

  const calculateNutrition = (food, amount) => {
    if (!nutritionDatabase[food]) return null;

    const baseData = nutritionDatabase[food];
    const multiplier = parseFloat(amount) / baseData.baseAmount;

    return {
      calories: Math.round(baseData.calories * multiplier),
      nutrients: Object.keys(baseData.nutrients).reduce((acc, nutrient) => {
        acc[nutrient] = Math.round(baseData.nutrients[nutrient] * multiplier * 10) / 10;
        return acc;
      }, {}),
      unit: baseData.unit
    };
  };

  const renderNutritionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showNutritionModal}
    >
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>Besin Değeri Düzenle</Text>
        
        {selectedFood && (
          <>
            <Text style={styles.foodTitle}>{selectedFood}</Text>
            <View style={styles.amountContainer}>
              <Text>Miktar ({nutritionDatabase[selectedFood]?.unit}):</Text>
              <TextInput
                style={styles.amountInput}
                value={foodAmount}
                onChangeText={setFoodAmount}
                keyboardType="numeric"
              />
            </View>

            {calculateNutrition(selectedFood, foodAmount) && (
              <View style={styles.nutritionInfo}>
                <Text style={styles.nutritionTitle}>Besin Değerleri:</Text>
                <Text>Kalori: {calculateNutrition(selectedFood, foodAmount).calories} kcal</Text>
                {Object.entries(calculateNutrition(selectedFood, foodAmount).nutrients).map(([nutrient, value]) => (
                  <Text key={nutrient}>
                    {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}: {value}g
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (selectedMeal) {
                  handleFoodChange(
                    selectedMeal.mealIndex,
                    selectedMeal.foodIndex,
                    `${selectedFood} (${foodAmount} ${nutritionDatabase[selectedFood]?.unit})`
                  );
                  setShowNutritionModal(false);
                }
              }}
            >
              <Text style={styles.buttonText}>Kaydet</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setShowNutritionModal(false)}
        >
          <Text style={styles.buttonText}>İptal</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const renderMeal = ({ item, index }) => (
    <View style={styles.mealContainer}>
      <Text style={styles.mealTitle}>{item.name}</Text>
      <Text style={styles.calorieText}>{Math.round(item.calories)} kcal</Text>
      
      {item.foods.map((food, foodIndex) => {
        const basicFoodName = food.split(' (')[0];
        return (
          <TouchableOpacity
            key={foodIndex}
            style={styles.foodItem}
            onPress={() => {
              setSelectedMeal({ mealIndex: index, foodIndex });
              if (nutritionDatabase[basicFoodName]) {
                setSelectedFood(basicFoodName);
                setFoodAmount('1');
                setShowNutritionModal(true);
              } else {
                setNewFood(food);
                setModalVisible(true);
              }
            }}
          >
            <Text>{food}</Text>
            {nutritionDatabase[basicFoodName] && (
              <Text style={styles.nutritionHint}>Besin değerlerini düzenlemek için dokun</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        renderItem={renderMeal}
        keyExtractor={(item, index) => index.toString()}
      />
      {renderNutritionModal()}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Yemek Değiştir</Text>
          
          <TextInput
            style={styles.input}
            value={newFood}
            onChangeText={setNewFood}
            placeholder="Yeni yemek adı"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (selectedMeal) {
                handleFoodChange(selectedMeal.mealIndex, selectedMeal.foodIndex, newFood);
                setModalVisible(false);
              }
            }}
          >
            <Text style={styles.buttonText}>Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>İptal</Text>
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
  mealContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  calorieText: {
    color: '#666',
    marginBottom: 10,
  },
  foodItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
    borderRadius: 5,
    width: 60,
    marginLeft: 10,
    textAlign: 'center',
  },
  nutritionInfo: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nutritionHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default DietProgramScreen; 