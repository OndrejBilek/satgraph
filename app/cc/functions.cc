#include "functions.hpp"
#include "satgraph.hpp"

void process(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate *isolate = args.GetIsolate();

  if (args.Length() == 2) {
    string path, type;
    int    neighbours = 0;
    double normalize  = 0;

    if (args[0]->IsString()) {
      path = string(*v8::String::Utf8Value(args[0]));
    }

    if (args[1]->IsObject()) {
      v8::Local<v8::Object> params = args[1]->ToObject();
      neighbours =
        params->Get(v8::String::NewFromUtf8(isolate,
                                            "neighbours"))->IntegerValue();
      normalize =
        params->Get(v8::String::NewFromUtf8(isolate, "normalize"))->NumberValue();
      v8::String::Utf8Value v8type(params->Get(v8::String::NewFromUtf8(isolate,
                                                                       "type"))->ToString());
      type = string(*v8type);
    }

    Satgraph satgraph(path, isolate, normalize, neighbours, type);
    args.GetReturnValue().Set(satgraph.getPackedData());
  } else {
    isolate->ThrowException(v8::Exception::TypeError(
                              v8::String::NewFromUtf8(isolate,
                                                      "Wrong arguments")));
  }
}
