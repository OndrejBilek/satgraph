#include "functions.hpp"

using v8::FunctionTemplate;

NAN_MODULE_INIT(InitAll) {
  Nan::Set(target, Nan::New("process").ToLocalChecked(),
           Nan::GetFunction(Nan::New<FunctionTemplate>(process)).ToLocalChecked());
}

NODE_MODULE(module, InitAll)
