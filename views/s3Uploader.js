/*
  Props:
    onStartUpload: ({file}) => void
    onUploaded: ({s3Key}) => void
*/

view S3Uploader {
  const pro = initPro(view, {
    accept: atom(),
    capture: atom(),
    multiple: M.defaultAtom(false),
    children: atom()
  })

  const uploading = atom(false)

  const handleFiles = (e) => {
    uploading.set(true)

    if (view.props.onStartUpload) {
      if (pro.multiple.get()) {
        view.props.onStartUpload({files: e.target.files})
      } else {
        view.props.onStartUpload({file: e.target.files[0]})
      }
    }

    Promise.all(List(e.target.files).map(handleFile)).then(s3Keys => {
      uploading.set(false)

      if (view.props.onUploaded) {
        if (pro.multiple.get()) {
          view.props.onUploaded({s3Keys})
        } else {
          view.props.onUploaded({s3Key: s3Keys[0]})
        }
      }

    }, err => {
      uploading.set(false)
      M.util.alertError(err)
    })
  }

  const handleFile = (file) => {
    let s3Key

    return M.apiPost('signS3Upload', {
      params: {
        fileType: file.type
      }
    }).then(apiResponse => {
      s3Key = apiResponse.s3Key
      const s3Url = `${M.config.s3UrlPrefix}${s3Key}`

      return fetch(apiResponse.signedRequest, {
        method: 'put',
        headers: {
          'x-amz-acl': 'public-read'
        },
        body: file
      })

    }, err => {
      uploading.set(false)
      console.error("Error signing S3 upload:", err)
      throw err

    }).then(s3Response => {
      return s3Key

    }, err => {
      uploading.set(false)
      console.error("Error uploading to S3:", err)
      throw err
    })
  }

  <notUploading if={!uploading.get()}>
    <Uploader
      accept={pro.accept.get()}
      capture={pro.capture.get()}
      onChange={handleFiles}
      multiple={pro.multiple.get()}
    >
      {pro.children.get()}
    </Uploader>
  </notUploading>
  <uploading if={uploading.get()}>
    {pro.children.get()}
  </uploading>
}
