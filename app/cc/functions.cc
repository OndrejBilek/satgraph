#include "functions.hpp"
#include "satgraph.hpp"

void process(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate *isolate = args.GetIsolate();

  if (args.Length() == 2) {
    std::string path, type;
    int neighbours = 0;
    int binning    = 0;
    double smooth  = 0;
    double diff    = 0;

    if (args[0]->IsString()) {
      path = std::string(*v8::String::Utf8Value(args[0]));
    }

    if (args[1]->IsObject()) {
      v8::Local<v8::Object> params = args[1]->ToObject();
      neighbours =
        params->Get(v8::String::NewFromUtf8(isolate,
                                            "neighbours"))->IntegerValue();
      smooth =
        params->Get(v8::String::NewFromUtf8(isolate, "smooth"))->NumberValue();
      diff =
        params->Get(v8::String::NewFromUtf8(isolate, "diff"))->NumberValue();
      binning =
        params->Get(v8::String::NewFromUtf8(isolate,
                                            "binning"))->IntegerValue();
    }

    Satgraph satgraph(path, isolate, neighbours, smooth, diff, binning);
    args.GetReturnValue().Set(satgraph.getPackedData());
  } else {
    isolate->ThrowException(v8::Exception::TypeError(
                              v8::String::NewFromUtf8(isolate,
                                                      "Wrong arguments")));
  }
}
