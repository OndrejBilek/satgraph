{
  "targets": [
    {
      "target_name": "tools",
      "sources": [ "cc/tools.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
