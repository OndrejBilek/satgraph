{
  "targets": [
    {
      "target_name": "module",
      "sources": [ "cc/module.cc", "cc/functions.cc", "cc/satgraph.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
