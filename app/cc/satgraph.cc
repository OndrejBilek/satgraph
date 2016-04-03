
#include "satgraph.hpp"

Satgraph::Satgraph(const string& path) {
  packedData = Nan::New<v8::Array>();

  clearComputed();
  loadDat(path);
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
  double lat = -90;
  double lon = 0;
  double idx = 0;

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

double Satgraph::getNeighbour(int i, int x) {
  if (computed[i][x] == 1) return -1;

  if (i >= 180) i -= 180;

  if (i < 0) i += 180;

  if (x >= 360) x -= 360;

  if (x < 0) x += 360;
  return map[i][x];
}

double Satgraph::prepNaive(int i, int x) {
  double bin;
  int    sum   = 0;
  int    count = 0;

  bin = getNeighbour(i + 1, x);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  bin = getNeighbour(i, x + 1);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  bin = getNeighbour(i + 1, x + 1);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  bin = getNeighbour(i - 1, x);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  bin = getNeighbour(i, x - 1);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  bin = getNeighbour(i - 1, x - 1);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  bin = getNeighbour(i - 1, x + 1);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  bin = getNeighbour(i + 1, x - 1);

  if (bin != -1) {
    sum += bin;
    count++;
  }

  if (count == 0) {
    return -1;
  } else {
    return sum / count;
  }
}

void Satgraph::prepDat() {
  for (int i = 0; i < 180; i++) {
    for (int x = 0; x < 360; x++) {
      if (map[i][x] == -1) {
        map[i][x]      = prepNaive(i, x);
        computed[i][x] = true;
      }
    }
  }
}
