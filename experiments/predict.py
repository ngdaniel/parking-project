import matplotlib.pylab as plt
import sys
import pandas as pd
import numpy as np
import random
from sklearn.metrics import mean_squared_error
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.ensemble.partial_dependence import plot_partial_dependence
from matplotlib.pylab import rcParams
rcParams['figure.figsize'] = 15, 9

data_path = 'datastore/paystations/'
model_params = {'n_estimators': 200, 'max_depth': 6,
                'learning_rate': 0.1, 'loss': 'huber', 'alpha': 0.95}


# Import pandas dataframe
def load_data(f, start, end):
    ts = pd.read_pickle(data_path + f)
    ts = ts.dropna()  # remove nan which are free parking days
    ts = ts[start:end]
    ts.plot(legend=True, kind='area', stacked=False)
    plt.ylabel('Transactions (hrs)')
    plt.title('Input Data')
    print 'Range :', start, 'to', end
    return ts


# Generate features
def init_features(ts):
    X = pd.DataFrame()
    X['month'] = ts.index.month
    # X['day'] = ts.index.day
    # X['rain'] = ts['rain'].values
    X['weekday'] = ts.index.weekday
    X['hour'] = ts.index.hour
    X.index = ts.index
    return X


# Train (n%) Test ((1-n)%) Random
def train_stochastic(X, Y, percent):
    rows = random.sample(X.index, int(len(X) * 0.80))
    x_train, y_train = X.ix[rows], Y.ix[rows]
    x_test, y_test = X.drop(rows), Y.drop(rows)
    return [x_train, y_train, x_test, y_test]


# Train historical data and predict the prediction window
def train_history(X, Y, predict_window):
    n_days = (X.index[-1] - X.index[0]).days
    percent_train = predict_window / float(n_days)
    split_i = int(len(X) * (1 - percent_train))
    x_train, y_train = X.ix[0:split_i - 1], Y.ix[0:split_i - 1]
    x_test, y_test = X.ix[split_i:len(X)], Y.ix[split_i:len(X)]
    return [x_train, y_train, x_test, y_test]


# Prediction Error
def print_error(prediction, y_test):
    mse = mean_squared_error(y_test, prediction)
    r2 = np.mean(abs(y_test - prediction))
    print("MSE: %.4f" % mse)
    print("Mean Error (R2): %.4f cars" % r2)


# Plot Predicted data over actual
def plot_prediction(prediction, x_test, y_test):
    y_pred = pd.DataFrame(prediction, index=x_test.index, columns=['prediction'])
    y_pred[y_pred < 0] = 0  # no negative
    plt.figure()
    ax = y_test.plot(legend=True, label='actual', kind='area', stacked=False)
    y_pred.plot(ax=ax, kind='area', stacked=False)


# Show the impact of features
def feature_importance(results, X):
    feature_importance = results.feature_importances_  # make importances relative to max importance
    feature_importance = 100.0 * (feature_importance / feature_importance.max())
    sorted_idx = np.argsort(feature_importance)
    pos = np.arange(sorted_idx.shape[0]) + .5
    plt.figure()
    plt.barh(pos, feature_importance[sorted_idx], align='center')
    plt.yticks(pos, X.columns[sorted_idx])
    plt.xlabel('Relative Importance')
    plt.title('Feature Importance')
    plt.show()


# Show the dependence of features
def feature_dependence(results, X, x_train):
    plot_partial_dependence(results, x_train,
                            features=np.arange(0, len(X.columns)),
                            feature_names=x_train.columns, n_cols=1)
    plt.show()


def main():
    # Init Data
    f = '76429_100_days_of_729.d'
    start = pd.to_datetime(ts.index[0], format='%m-%d-%Y')
    end = pd.to_datetime(ts.index[-1], format='%m-%d-%Y')
    if len(sys.argv) > 1:
        f = sys.argv[1]
    ts = load_data(f, start, end)
    X = init_features(ts)  # features considered for prediction
    Y = ts['density']  # variable to predict

    # Run Model
    # x_train, y_train, x_test, y_test = train_stochastic(X, Y, 0.8)  # random sample (80% train)
    predict_window = 7  # predict 1 week
    x_train, y_train, x_test, y_test = train_history(X, Y, predict_window)  # train past data
    results = GradientBoostingRegressor(**model_params).fit(x_train, y_train)
    prediction = np.round(results.predict(x_test))
    print prediction  # TODO Save prediction to disk

    # Analyse Results
    # TODO save figs to disk?
    print_error(prediction, y_test)
    plot_prediction(prediction, x_test, y_test)
    feature_importance(results, X)
    feature_dependence(results, X, x_train)


if __name__ == "__main__":
    main()
