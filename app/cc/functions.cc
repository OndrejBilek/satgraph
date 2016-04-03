#include "functions.hpp"
#include "satgraph.hpp"

NAN_METHOD(process) {
  if (info.Length() == 1) {
    if (info[0]->IsString()) {
      string path(*Nan::Utf8String(info[0]->ToString()));
      Satgraph satgraph(path);
      info.GetReturnValue().Set(satgraph.getPackedData());
    } else {
      Nan::ThrowTypeError("Wrong argument, expecting string");
    }
  } else {
    Nan::ThrowTypeError("Wrong number of arguments, expecting 1");
  }
}
