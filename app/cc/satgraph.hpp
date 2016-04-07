#ifndef SATGRAPH_H
#define SATGRAPH_H

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <nan.h>
using namespace std;

class Satgraph {
public:

  Satgraph(const string&);
  v8::Local<v8::Array>getPackedData();

private:

  void loadDat(const string&);
  void clearComputed();
  void packDat();
  void prepDat();
  void normalizeDat();
  double prepNaive(int,
                   int,
                   size_t);
  void   getNeighbour(int,
                      int,
                      vector<double>&);
  double average(vector<double>&);
  double median(vector<double>&);
  void   kNearest(int, int, size_t, vector<double>&);
  double normalize(int, int, size_t);

  double map[180][360];
  int    computed[180][360];
  v8::Local<v8::Array> packedData;
};

#endif /* ifndef SATGRAPH_H */
