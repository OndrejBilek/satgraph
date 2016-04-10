#ifndef SATGRAPH_H
#define SATGRAPH_H

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <node.h>
using namespace std;

class Satgraph {
public:

  Satgraph(const string&,
           v8::Isolate *,
           double,
           int,
           const string&);
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

  v8::Isolate *_isolate;
  v8::Local<v8::Array> _packedData;

  double _map[180][360];
  int    _computed[180][360];

  double _normalize;
  int    _neighbours;
  const string& _type;
  const string& _path;
};

#endif /* ifndef SATGRAPH_H */
