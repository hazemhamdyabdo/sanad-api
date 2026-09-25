# Same base as before (postgres:17-alpine) with pgvector compiled in — the existing data volume
# keeps working untouched. Staying on Alpine/musl on purpose: the Debian-based pgvector/pgvector
# image uses glibc collation, which doesn't match the ordering of text indexes built under musl.
FROM postgres:17-alpine

ARG PGVECTOR_VERSION=0.8.1

# with_llvm=no: the image's pgxs expects clang for JIT bitcode, which pgvector doesn't need.
# OPTFLAGS="": pgvector defaults to -march=native, which would tie the image to the build CPU.
RUN apk add --no-cache --virtual .pgvector-build git build-base \
  && git clone --branch "v${PGVECTOR_VERSION}" --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
  && make -C /tmp/pgvector with_llvm=no OPTFLAGS="" \
  && make -C /tmp/pgvector with_llvm=no install \
  && rm -rf /tmp/pgvector \
  && apk del .pgvector-build
