import numpy as np
import tensorflow as tf
from tensorflow import keras

# Dummy data: 100 races, 10 features (replace with real F1 data)
X = np.random.rand(100, 10)
# Dummy labels: 20 drivers, one-hot encoded winner per race
num_drivers = 20
y = keras.utils.to_categorical(np.random.randint(0, num_drivers, 100), num_classes=num_drivers)

# Simple model: input -> dense -> softmax (predicts winner probability for each driver)
model = keras.Sequential([
    keras.layers.Input(shape=(10,)),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(num_drivers, activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Train (replace X, y with real data for real use)
model.fit(X, y, epochs=10, batch_size=8)

# Save model
model.save('model.h5')

print('Model trained and saved as model.h5') 