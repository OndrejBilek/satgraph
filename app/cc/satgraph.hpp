#ifndef SATGRAPH_H
#define SATGRAPH_H

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <nan.h>
using namespace std;

class Satgraph {
public:

  Satgraph(const string&);
  v8::Local<v8::Array>getPackedData();

private:

  void   loadDat(const string&);
  void   clearComputed();
  void   packDat();
  void   prepDat();
  double prepNaive(int,
                   int);
  double getNeighbour(int,
                      int);

  float map[180][360];
  int   computed[180][360];
  v8::Local<v8::Array> packedData;
};

#endif /* ifndef SATGRAPH_H */
