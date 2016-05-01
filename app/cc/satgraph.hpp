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
           double,
           int);
  v8::Local<v8::Array>getPackedData();
  ~Satgraph();

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

  double **_map;
  int    **_computed;

  double _diff;
  double _smooth;
  double _step;
  int    _neighbours;
  int    _width;
  int    _height;
  int    _start;
  int    _stop;
  const string& _path;
};

#endif /* ifndef SATGRAPH_H */
