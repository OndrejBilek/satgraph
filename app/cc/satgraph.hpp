#ifndef SATGRAPH_H
#define SATGRAPH_H

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>
#include <node.h>
using namespace std;

class Satgraph {
public:

  Satgraph(const string&,
           v8::Isolate *,
           int,
           double,
           double);
  v8::Local<v8::Array>getPackedData();

private:

  void   loadDat(const string&);
  void   clearComputed();
  void   packDat();
  void   prepDat();
  void   cleanDat();
  double prep(int,
              int,
              int);
  void   getNeighbour(int,
                      int,
                      int *,
                      int,
                      double *,
                      double *);
  double sum(vector<double>&);
  void   kNearest(int,
                  int,
                  int,
                  double *,
                  double *);
  double clean(int,
               int,
               int);

  v8::Isolate *_isolate;
  v8::Local<v8::Array> _packedData;

  double _map[180][360];
  int    _computed[180][360];

  double _diff;
  double _smooth;
  int    _neighbours;
  const string& _path;
};

#endif /* ifndef SATGRAPH_H */
