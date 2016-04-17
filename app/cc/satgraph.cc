
#include "satgraph.hpp"

Satgraph::Satgraph(const string& path,
                   v8::Isolate  *isolate,
                   int           neighbours,
                   double        smooth,
                   double        diff) :
  _isolate(isolate),
  _diff(diff),
  _smooth(smooth),
  _neighbours(neighbours),
  _path(path) {
  _packedData = v8::Array::New(_isolate, 4);

  clearComputed();
  loadDat(_path);
  cleanDat();
  prepDat();
  packDat();
}

void Satgraph::clearComputed() {
  for (int i = 0; i < 180; i++) {
    for (int x = 0; x < 360; x++) {
      _computed[i][x] = 0;
    }
  }
}

void Satgraph::loadDat(const string& path) {
  int col = 0;
  int row = 0;
  int i   = 0;
  string   line;
  ifstream file;

  file.open(_path);

  // if (file.fail()) throw exception();

  for (string line; getline(file, line);) {
    // if (file.fail()) throw exception();

    string value;
    istringstream in(line);

    col = 0;

    while (in >> value) {
      _map[row][col++] = stof(value);
      i++;
    }

    row++;
  }
}

void Satgraph::packDat() {
  double lat       = -90;
  double lon       = 0;
  unsigned int idx = 0;

  for (int i = 0; i < 180; i++) {
    lon = 0;
    int x = 0;

    for (; x < 180; x++) {
      v8::Local<v8::Object> object = v8::Object::New(_isolate);
      object->Set(0, v8::Number::New(_isolate, lon++));
      object->Set(1, v8::Number::New(_isolate, lat));
      object->Set(2, v8::Number::New(_isolate, _map[i][x]));
      object->Set(3, v8::Number::New(_isolate, _computed[i][x]));
      _packedData->Set(idx++, object);
    }
    lon = -180;

    for (; x < 360; x++) {
      v8::Local<v8::Object> object = v8::Object::New(_isolate);
      object->Set(0, v8::Number::New(_isolate, lon++));
      object->Set(1, v8::Number::New(_isolate, lat));
      object->Set(2, v8::Number::New(_isolate, _map[i][x]));
      object->Set(3, v8::Number::New(_isolate, _computed[i][x]));
      _packedData->Set(idx++, object);
    }
    lat++;
  }
}

v8::Local<v8::Array>Satgraph::getPackedData() {
  return _packedData;
}

void Satgraph::getNeighbour(int     i,
                            int     x,
                            int    *k,
                            int     offset,
                            double *sum,
                            double *weights) {
  double distance = (double)offset;

  if (i >= 180) i -= 180;

  if (i < 0) i += 180;

  if (x >= 360) x -= 360;

  if (x < 0) x += 360;

  if ((_map[i][x] != -1) && (_computed[i][x] == 0)) {
    double weight = pow(distance, -1.0 * _smooth);
    *weights += weight;
    *sum     += _map[i][x] * weight;
    (*k)--;
  }
}

void Satgraph::kNearest(int i, int x, int k, double *sum, double *weights) {
  int offset = 1;

  while (true) {
    getNeighbour(i + offset, x, &k, offset, sum, weights);

    if (k == 0) return;

    getNeighbour(i, x + offset, &k, offset, sum, weights);

    if (k == 0) return;

    getNeighbour(i + offset, x + offset, &k, offset, sum, weights);

    if (k == 0) return;

    getNeighbour(i - offset, x, &k, offset, sum, weights);

    if (k == 0) return;

    getNeighbour(i, x - offset, &k, offset, sum, weights);

    if (k == 0) return;

    getNeighbour(i - offset, x - offset, &k, offset, sum, weights);

    if (k == 0) return;

    getNeighbour(i - offset, x + offset, &k, offset, sum, weights);

    if (k == 0) return;

    getNeighbour(i + offset, x - offset, &k, offset, sum, weights);

    if (k == 0) return;

    offset++;
  }
}

double Satgraph::clean(int i, int x, int k) {
  double sum     = 0;
  double weights = 0;

  kNearest(i, x, k, &sum, &weights);

  double cleaned = sum / weights;
  double diff    = abs(cleaned - _map[i][x]);

  if (diff > _diff) {
    _computed[i][x] = 2;
    return cleaned;
  } else {
    return _map[i][x];
  }
}

double Satgraph::prep(int i, int x, int k) {
  double sum     = 0;
  double weights = 0;

  kNearest(i, x, k, &sum, &weights);
  return sum / weights;
}

void Satgraph::cleanDat() {
  if ((_diff != 0) && (_neighbours != 0)) {
    for (int i = 8; i < 171; i++) {
      for (int x = 0; x < 360; x++) {
        if (_map[i][x] != -1) {
          _map[i][x] = clean(i, x, _neighbours);
        }
      }
    }
  }
}

void Satgraph::prepDat() {
  if ((_smooth != 0) && (_neighbours != 0)) {
    for (int i = 8; i < 171; i++) {
      for (int x = 0; x < 360; x++) {
        if (_map[i][x] == -1) {
          _map[i][x]      = prep(i, x, _neighbours);
          _computed[i][x] = 1;
        }
      }
    }
  }
}
