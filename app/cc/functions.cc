#include "functions.hpp"
#include "satgraph.hpp"

void process(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate *isolate = args.GetIsolate();

  if (args.Length() == 2) {
    string path, type;
    double neighbours, normalize;

    if (args[0]->IsString()) {
      path = string(*v8::String::Utf8Value(args[0]));
    }

    if (args[1]->IsObject()) {
      // v8::Handle<v8::Object> object = v8::Handle<v8::Object>::Cast(info[1]);
      // object->Get(*Nan::New("aaa"));
    }

    Satgraph satgraph(path, isolate);
    args.GetReturnValue().Set(satgraph.getPackedData());
  } else {
    isolate->ThrowException(v8::Exception::TypeError(
                              v8::String::NewFromUtf8(isolate,
                                                      "Wrong arguments")));
  }
}
