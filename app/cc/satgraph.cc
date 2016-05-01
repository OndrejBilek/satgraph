
#include "satgraph.hpp"

Satgraph::Satgraph(const string& path,
                   v8::Isolate  *isolate,
                   int           neighbours,
                   double        smooth,
                   double        diff,
                   int           binning) :
  _isolate(isolate),
  _diff(diff),
  _smooth(smooth),
  _neighbours(neighbours),
  _path(path) {
  switch (binning) {
  case 1:
    _width  = 360;
    _height = 180;
    _step   = 1;
    _start  = 8;
    _stop   = 171;
    break;

  case 2:
    _width  = 720;
    _height = 360;
    _step   = 0.5;
    _start  = 16;
    _stop   = 343;
    break;

  case 4:
    _width  = 1440;
    _height = 720;
    _step   = 0.25;
    _start  = 32;
    _stop   = 687;
    break;

  case 6:
    _width  = 2160;
    _height = 1080;
    _step   = 1.0 / 6.0;
    _start  = 48;
    _stop   = 1031;
    break;
  }

  _packedData = v8::Array::New(_isolate, 4);
  _map        = new double *[_height];
  _computed   = new int *[_height];

  for (int i = 0; i < _height; i++) {
    _map[i] = new double[_width];
  }

  for (int i = 0; i < _height; i++) {
    _computed[i] = new int[_width];
  }

  clearComputed();
  loadDat(_path);
  cleanDat();
  prepDat();
  packDat();
}

Satgraph::~Satgraph() {
  for (int i = 0; i < _height; i++) {
    delete[] _map[i];
  }
  delete[] _map;

  for (int i = 0; i < _height; i++) {
    delete[]  _computed[i];
  }
  delete[] _computed;
}

void Satgraph::clearComputed() {
  for (int i = 0; i < _height; i++) {
    for (int x = 0; x < _width; x++) {
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
  double lon       = -180;
  unsigned int idx = 0;

  for (int i = 0; i < _height; i++) {
    lon = -180;

    for (int x = 0; x < _width; x++) {
      v8::Local<v8::Object> object = v8::Object::New(_isolate);
      object->Set(0, v8::Number::New(_isolate, lon += _step));
      object->Set(1, v8::Number::New(_isolate, lat));
      object->Set(2, v8::Number::New(_isolate, _map[i][x]));
      object->Set(3, v8::Number::New(_isolate, _computed[i][x]));
      _packedData->Set(idx++, object);
    }
    lat += _step;
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

  if (i >= _height) i -= _height;

  if (i < 0) i += _height;

  if (x >= _width) x -= _width;

  if (x < 0) x += _width;

  if ((_map[i][x] != 0) && (_computed[i][x] == 0)) {
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
    for (int i = _start; i < _stop; i++) {
      for (int x = 0; x < _width; x++) {
        if (_map[i][x] != 0) {
          _map[i][x] = clean(i, x, _neighbours);
        }
      }
    }
  }
}

void Satgraph::prepDat() {
  if ((_smooth != 0) && (_neighbours != 0)) {
    for (int i = _start; i < _stop; i++) {
      for (int x = 0; x < _width; x++) {
        if (_map[i][x] == 0) {
          _map[i][x]      = prep(i, x, _neighbours);
          _computed[i][x] = 1;
        }
      }
    }
  }
}
