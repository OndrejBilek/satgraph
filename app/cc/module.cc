#include <node.h>
#include "functions.hpp"

void InitAll(v8::Local<v8::Object>exports) {
  NODE_SET_METHOD(exports, "process", process);
}

NODE_MODULE(module, InitAll)
