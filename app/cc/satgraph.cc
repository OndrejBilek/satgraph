
#include "satgraph.hpp"

Satgraph::Satgraph(const string& path) {
  packedData = Nan::New<v8::Array>();

  clearComputed();
  loadDat(path);
  normalizeDat();
  prepDat();
  packDat();
}

void Satgraph::clearComputed() {
  for (int i = 0; i < 180; i++) {
    for (int x = 0; x < 360; x++) {
      computed[i][x] = 0;
    }
  }
}

void Satgraph::loadDat(const string& path) {
  int col = 0;
  int row = 0;
  int i   = 0;
  string   line;
  ifstream file;

  file.open(path);

  // if (file.fail()) throw exception();

  for (string line; getline(file, line);) {
    // if (file.fail()) throw exception();

    string value;
    istringstream in(line);

    col = 0;

    while (in >> value) {
      map[row][col++] = stof(value);
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
      v8::Local<v8::Object> object = Nan::New<v8::Object>();
      object->Set(0, Nan::New<v8::Number>(lon++));
      object->Set(1, Nan::New<v8::Number>(lat));
      object->Set(2, Nan::New<v8::Number>(map[i][x]));
      object->Set(3, Nan::New<v8::Number>(computed[i][x]));
      packedData->Set(idx++, object);
    }
    lon = -180;

    for (; x < 360; x++) {
      v8::Local<v8::Object> object = Nan::New<v8::Object>();
      object->Set(0, Nan::New<v8::Number>(lon++));
      object->Set(1, Nan::New<v8::Number>(lat));
      object->Set(2, Nan::New<v8::Number>(map[i][x]));
      object->Set(3, Nan::New<v8::Number>(computed[i][x]));
      packedData->Set(idx++, object);
    }
    lat++;
  }
}

v8::Local<v8::Array>Satgraph::getPackedData() {
  return packedData;
}

void Satgraph::getNeighbour(int i, int x,  vector<double>& bins) {
  if (i >= 180) i -= 180;

  if (i < 0) i += 180;

  if (x >= 360) x -= 360;

  if (x < 0) x += 360;

  if ((map[i][x] != -1) && (computed[i][x] != 1)) {
    bins.push_back(map[i][x]);
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
  vector<double> bins;
  kNearest(i, x, k, bins);

  // double med = median(bins);
  double med = average(bins);

  if (map[i][x] > 1.2 * med) {
    computed[i][x] = 2;
    return med;
  }

  return map[i][x];
}

double Satgraph::prepNaive(int i, int x, size_t k) {
  vector<double> bins;
  kNearest(i, x, k, bins);

  // return median(bins);

  return average(bins);
}

void Satgraph::normalizeDat() {
  for (int i = 8; i < 171; i++) {
    for (int x = 0; x < 360; x++) {
      if (map[i][x] != -1) {
        map[i][x] = normalize(i, x, 8);
      }
    }
  }
}

void Satgraph::prepDat() {
  for (int i = 8; i < 171; i++) {
    for (int x = 0; x < 360; x++) {
      if (map[i][x] == -1) {
        map[i][x]      = prepNaive(i, x, 8);
        computed[i][x] = 1;
      }
    }
  }
}
