import {React, useState, useEffect} from 'react';
import { 
  Platform, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, } from 'react-native';
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function BMIHistory() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, bmi, height, weight, date(bmiDate) as bmiDate from bmi order by bmiDate desc;`,
        [],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  });

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.historyHeading}>BMI History</Text>
      {items.map(({ id, bmi, height, weight, bmiDate }) => (
        <Text key={id} style={styles.bmiSection}>{bmiDate}:  {bmi} (W:{weight}, H:{height})</Text>
      ))}
    </View>
  );
}

export default function App() {
  const [height, setHeight] = useState(null);
  const [weight, setWeight] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [assessment, setAssessment] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists bmi (id integer primary key not null, bmi real, height real, weight real, bmiDate real);"
      );
    });
  }, []);

  const add = () => {
    if (weight === null || weight === "" || height === null || height === "") {
      return false;
    }

    const bmi = calcBmi();
    if (bmi === null || bmi === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into bmi (bmi, height, weight, bmiDate) values (?, ?, ?, julianday('now'))", [bmi, height, weight]);
        tx.executeSql("select * from bmi", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      }
    );
  };

  const calcBmi = () => {
    const bmi = ((weight / (height * height)) * 703).toFixed(1);
    setBmi(bmi);
    if(bmi < 18.5) {
      setAssessment('(Underweight)');
    }else if(bmi < 25) {
      setAssessment('(Healthy)');
    }else if(bmi < 30) {
      setAssessment('(Overweight)');
    }else {
      setAssessment('(Obese)');
    }
    setWeight('');
    setHeight('');
    return bmi;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.toolbar}>BMI Calculator</Text>
      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <TextInput
            style={styles.input}
            onChangeText={(weight) => setWeight(weight)}
            value={weight}
            placeholder="Weight in Pounds"
          />
          <TextInput
            style={styles.input}
            onChangeText={(height) => setHeight(height)}
            value={height}
            placeholder="Height in Inches"
          />
          <TouchableOpacity onPress={() => add()} style={styles.button}>
            <Text style={styles.buttonText}>Compute BMI</Text>
          </TouchableOpacity>
          <Text style={styles.bmi}>{bmi ? 'Body Mass Index is ' + bmi : ''}</Text>
          <Text style={styles.bmiRange}>{bmi ? assessment : ''}</Text>
          <BMIHistory/>
        </ScrollView>
    )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
  },
  scrollContainer: {
    width: '100%',
    padding: 10,
  },
  toolbar: {
    backgroundColor: '#f4511e',
    fontSize: 28,
    fontWeight: 'bold',
    padding: 40,
    textAlign: 'center',
    width: '100%',
    color: 'white',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#ecf0f1',
    fontSize: 24,
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    flex: 1,
  },
  button: {
    backgroundColor: '#34495e',
    fontSize: 24,
    borderRadius: 5,
  },
  bmi: {
    fontSize: 28,
    textAlign: 'center',
    paddingTop: 20,
  },
  bmiRange: {
    fontSize: 28,
    textAlign: 'center',
    paddingBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    padding: 10,
    fontSize: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionContainer: {
    margin: 20,
  },
  bmiSection: {
    padding: 0,
    fontSize: 20,
  },
  historyHeading: {
    fontSize: 24,
    marginBottom: 4,
  },
});