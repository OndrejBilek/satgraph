
#include "satgraph.hpp"

Satgraph::Satgraph(const string& path,
                   v8::Isolate  *isolate,
                   double        normalize,
                   int           neighbours,
                   const string& type) :
  _isolate(isolate),
  _normalize(normalize),
  _neighbours(neighbours),
  _type(type),
  _path(path) {
  _packedData = v8::Array::New(_isolate, 4);

  clearComputed();
  loadDat(_path);
  normalizeDat();
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

void Satgraph::getNeighbour(int i, int x,  vector<double>& bins) {
  if (i >= 180) i -= 180;

  if (i < 0) i += 180;

  if (x >= 360) x -= 360;

  if (x < 0) x += 360;

  if ((_map[i][x] != -1) && (_computed[i][x] != 1)) {
    bins.push_back(_map[i][x]);
  }
}

double Satgraph::average(vector<double>& bins) {
  double sum = 0;

  for (auto bin : bins) {
    sum += bin;
  }

  return sum / bins.size();
}

double Satgraph::median(vector<double>& bins) {
  double median;
  size_t size = bins.size();

  sort(bins.begin(), bins.end());

  if (size % 2 == 0)  {
    median = (bins[size / 2 - 1] + bins[size / 2]) / 2;
  } else {
    median = bins[size / 2];
  }

  return median;
}

void Satgraph::kNearest(int i, int x, size_t k, vector<double>& bins) {
  int offset = 1;

  while (true) {
    getNeighbour(i + offset, x, bins);

    if (bins.size() >= k) return;

    getNeighbour(i, x + offset, bins);

    if (bins.size() >= k) return;

    getNeighbour(i + offset, x + offset, bins);

    if (bins.size() >= k) return;

    getNeighbour(i - offset, x, bins);

    if (bins.size() >= k) return;

    getNeighbour(i, x - offset, bins);

    if (bins.size() >= k) return;

    getNeighbour(i - offset, x - offset, bins);

    if (bins.size() >= k) return;

    getNeighbour(i - offset, x + offset, bins);

    if (bins.size() >= k) return;

    getNeighbour(i + offset, x - offset, bins);

    if (bins.size() >= k) return;

    offset++;
  }
}

double Satgraph::normalize(int i, int x, size_t k) {
  double value = 0;

  vector<double> bins;
  kNearest(i, x, k, bins);

  if (_type == "median") {
    value = median(bins);
  } else if (_type == "average") {
    value = average(bins);
  }

  if (_map[i][x] > _normalize * value) {
    _computed[i][x] = 2;
    return value;
  }

  return _map[i][x];
}

double Satgraph::prepNaive(int i, int x, size_t k) {
  double value = 0;

  vector<double> bins;
  kNearest(i, x, k, bins);

  if (_type == "median") {
    value = median(bins);
  } else if (_type == "average") {
    value = average(bins);
  }

  return value;
}

void Satgraph::normalizeDat() {
  if ((_normalize != 0) && (_neighbours != 0)) {
    for (int i = 8; i < 171; i++) {
      for (int x = 0; x < 360; x++) {
        if (_map[i][x] != -1) {
          _map[i][x] = normalize(i, x, _neighbours);
        }
      }
    }
  }
}

void Satgraph::prepDat() {
  if (_neighbours != 0) {
    for (int i = 8; i < 171; i++) {
      for (int x = 0; x < 360; x++) {
        if (_map[i][x] == -1) {
          _map[i][x]      = prepNaive(i, x, _neighbours);
          _computed[i][x] = 1;
        }
      }
    }
  }
}
